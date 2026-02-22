#!/usr/bin/env python3
"""Kreator Wideo Nieruchomości — Flask server (port 5558)"""

import os
import json
import uuid
import subprocess
import shutil
import zipfile
import re
from pathlib import Path
from flask import Flask, request, jsonify, send_file, render_template

try:
    import requests as req
    from bs4 import BeautifulSoup
    HAS_SCRAPING = True
except ImportError:
    HAS_SCRAPING = False

app = Flask(__name__)

BASE_DIR = Path(__file__).parent
PUBLIC_DIR = BASE_DIR / "public"
UPLOADS_DIR = PUBLIC_DIR / "uploads"
OUT_DIR = BASE_DIR / "out"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload_photos():
    """Upload zdjęć — zapisuje do public/uploads/{session_id}/"""
    session_id = request.form.get("session_id", str(uuid.uuid4())[:8])
    session_dir = UPLOADS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    uploaded = []
    for key in request.files:
        f = request.files[key]
        if f.filename:
            safe_name = f.filename.replace(" ", "_")
            save_path = session_dir / safe_name
            f.save(str(save_path))
            # Ścieżka relatywna do public/ (dla staticFile w Remotion)
            rel_path = f"uploads/{session_id}/{safe_name}"
            uploaded.append({"name": safe_name, "path": rel_path})

    return jsonify({"session_id": session_id, "files": uploaded})


def get_brand(data):
    """Wyciągnij brand config z danych formularza"""
    brand = {}
    if data.get("stylePreset"):
        brand["stylePreset"] = data["stylePreset"]
    if data.get("headline"):
        brand["headline"] = data["headline"]
    if data.get("ctaText"):
        brand["ctaText"] = data["ctaText"]
    if data.get("ctaSubtext"):
        brand["ctaSubtext"] = data["ctaSubtext"]
    if data.get("logoPath"):
        brand["logoSrc"] = data["logoPath"]
    return brand if brand else None


@app.route("/upload-logo", methods=["POST"])
def upload_logo():
    """Upload logo agencji"""
    session_id = request.form.get("session_id", str(uuid.uuid4())[:8])
    session_dir = UPLOADS_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    f = request.files.get("logo")
    if not f or not f.filename:
        return jsonify({"error": "Brak pliku logo"}), 400

    safe_name = "logo_" + f.filename.replace(" ", "_")
    save_path = session_dir / safe_name
    f.save(str(save_path))
    rel_path = f"uploads/{session_id}/{safe_name}"

    return jsonify({"session_id": session_id, "logoPath": rel_path})


@app.route("/render", methods=["POST"])
def render_video():
    """Renderuj wideo lub karuzelę"""
    data = request.json
    template = data.get("template", "reel")  # reel / carousel / sold
    render_id = str(uuid.uuid4())[:8]

    try:
        if template == "reel":
            return render_reel(data, render_id)
        elif template == "carousel":
            return render_carousel(data, render_id)
        elif template == "sold":
            return render_sold(data, render_id)
        else:
            return jsonify({"error": f"Nieznany szablon: {template}"}), 400
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": "Rendering nie powiódł się",
            "details": e.stderr.decode("utf-8", errors="replace") if e.stderr else str(e)
        }), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def render_reel(data, render_id):
    """Renderuj rolkę ofertową (RealEstateReel)"""
    photos = data.get("photos", [])
    if not photos:
        return jsonify({"error": "Dodaj przynajmniej 1 zdjęcie"}), 400

    # Uzupełnij do 5 zdjęć (powtórz ostatnie)
    while len(photos) < 5:
        photos.append(photos[-1].copy())

    brand = get_brand(data)
    props = {
        "listing": {
            "title": data.get("title", "Oferta"),
            "location": data.get("location", ""),
            "price": data.get("price", ""),
            "area": data.get("area", ""),
            "rooms": data.get("rooms", ""),
            "floor": data.get("floor", ""),
            "year": data.get("year", ""),
            "features": data.get("features", []),
            "agent": data.get("agent", ""),
            "agentPhone": data.get("agentPhone", ""),
            "photos": [{"src": p["path"], "label": p.get("label", "")} for p in photos[:5]],
        },
    }
    if brand:
        props["brand"] = brand

    # Video effects from description
    desc = data.get("effectsDescription", "")
    effects = parse_effects_description(desc) if desc else data.get("effects", {})
    if effects:
        props["effects"] = effects

    props_file = OUT_DIR / f"{render_id}-props.json"
    props_file.write_text(json.dumps(props, ensure_ascii=False))

    output_file = OUT_DIR / f"{render_id}-rolka.mp4"
    run_remotion("render", "RealEstateReel", str(output_file), str(props_file))

    # Cleanup props
    props_file.unlink(missing_ok=True)

    return jsonify({
        "success": True,
        "type": "video",
        "download_url": f"/download/{render_id}-rolka.mp4",
        "filename": f"rolka-{render_id}.mp4",
    })


def render_carousel(data, render_id):
    """Renderuj karuzelę Instagram (5 slajdów PNG)"""
    photos = data.get("photos", [])
    if not photos:
        return jsonify({"error": "Dodaj przynajmniej 1 zdjęcie"}), 400

    slides = []
    total_slides = 2 + min(len(photos), 3) + 1  # cover + photos + details + cta

    brand = get_brand(data)
    base_props = {
        "title": data.get("title", "Oferta"),
        "location": data.get("location", ""),
        "price": data.get("price", ""),
        "area": data.get("area", ""),
        "rooms": data.get("rooms", ""),
        "floor": data.get("floor", ""),
        "year": data.get("year", ""),
        "features": data.get("features", []),
        "agent": data.get("agent", ""),
        "agentPhone": data.get("agentPhone", ""),
        "totalSlides": total_slides,
    }
    if brand:
        base_props["brand"] = brand

    # Video effects from description
    desc = data.get("effectsDescription", "")
    effects = parse_effects_description(desc) if desc else data.get("effects", {})
    if effects:
        base_props["effects"] = effects

    slide_num = 1

    # Slide 1: Cover
    cover_props = {
        **base_props,
        "slideType": "cover",
        "photoSrc": photos[0]["path"],
        "photoLabel": photos[0].get("label", ""),
        "slideNumber": slide_num,
    }
    slides.append(("cover", cover_props))
    slide_num += 1

    # Slides 2-4: Photos (max 3)
    for i, photo in enumerate(photos[:3]):
        photo_props = {
            **base_props,
            "slideType": "photo",
            "photoSrc": photo["path"],
            "photoLabel": photo.get("label", f"Zdjecie {i+1}"),
            "slideNumber": slide_num,
        }
        slides.append((f"photo{i+1}", photo_props))
        slide_num += 1

    # Slide: Details
    details_props = {
        **base_props,
        "slideType": "details",
        "photoSrc": photos[0]["path"],
        "photoLabel": "",
        "slideNumber": slide_num,
    }
    slides.append(("details", details_props))
    slide_num += 1

    # Slide: CTA
    cta_props = {
        **base_props,
        "slideType": "cta",
        "photoSrc": photos[0]["path"],
        "photoLabel": "",
        "slideNumber": slide_num,
    }
    slides.append(("cta", cta_props))

    # Render each slide as PNG
    output_files = []
    for i, (name, props) in enumerate(slides):
        props_file = OUT_DIR / f"{render_id}-slide-{i}-props.json"
        props_file.write_text(json.dumps(props, ensure_ascii=False))

        output_file = OUT_DIR / f"{render_id}-slide-{i+1}-{name}.png"
        run_remotion("still", "CarouselSlide", str(output_file), str(props_file))

        props_file.unlink(missing_ok=True)
        output_files.append(output_file)

    # Create ZIP with all slides
    zip_path = OUT_DIR / f"{render_id}-karuzela.zip"
    with zipfile.ZipFile(str(zip_path), "w") as zf:
        for i, f in enumerate(output_files):
            zf.write(str(f), f"karuzela-slide-{i+1}.png")

    # Cleanup individual PNGs
    for f in output_files:
        f.unlink(missing_ok=True)

    return jsonify({
        "success": True,
        "type": "carousel",
        "download_url": f"/download/{render_id}-karuzela.zip",
        "filename": f"karuzela-{render_id}.zip",
        "slide_count": len(slides),
    })


def render_sold(data, render_id):
    """Renderuj wideo 'Sprzedane!'"""
    photos = data.get("photos", [])
    if not photos:
        return jsonify({"error": "Dodaj przynajmniej 1 zdjęcie"}), 400

    brand = get_brand(data)
    props = {
        "title": data.get("title", ""),
        "location": data.get("location", ""),
        "price": data.get("price", ""),
        "agent": data.get("agent", ""),
        "agentPhone": data.get("agentPhone", ""),
        "photoSrc": photos[0]["path"],
    }
    if brand:
        props["brand"] = brand

    # Video effects from description
    desc = data.get("effectsDescription", "")
    effects = parse_effects_description(desc) if desc else data.get("effects", {})
    if effects:
        props["effects"] = effects

    props_file = OUT_DIR / f"{render_id}-props.json"
    props_file.write_text(json.dumps(props, ensure_ascii=False))

    output_file = OUT_DIR / f"{render_id}-sprzedane.mp4"
    run_remotion("render", "SoldVideo", str(output_file), str(props_file))

    props_file.unlink(missing_ok=True)

    return jsonify({
        "success": True,
        "type": "video",
        "download_url": f"/download/{render_id}-sprzedane.mp4",
        "filename": f"sprzedane-{render_id}.mp4",
    })


def run_remotion(mode, composition, output, props_file):
    """Wywołaj Remotion CLI"""
    cmd = [
        "npx", "remotion", mode,
        composition,
        output,
        "--props", props_file,
    ]

    if mode == "still":
        cmd.extend(["--frame", "0"])

    result = subprocess.run(
        cmd,
        cwd=str(BASE_DIR),
        capture_output=True,
        timeout=300,  # 5 min max
    )

    if result.returncode != 0:
        raise subprocess.CalledProcessError(
            result.returncode, cmd,
            output=result.stdout, stderr=result.stderr
        )


@app.route("/download/<filename>")
def download_file(filename):
    """Pobierz wyrenderowany plik"""
    file_path = OUT_DIR / filename
    if not file_path.exists():
        return jsonify({"error": "Plik nie znaleziony"}), 404

    return send_file(
        str(file_path),
        as_attachment=True,
        download_name=filename,
    )


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    """Serwuj zdjecia z uploads (potrzebne do podgladu Otodom)"""
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        return jsonify({"error": "Plik nie znaleziony"}), 404
    return send_file(str(file_path))


@app.route("/scrape-otodom", methods=["POST"])
def scrape_otodom():
    """Scrape danych oferty z Otodom URL"""
    if not HAS_SCRAPING:
        return jsonify({"error": "Brak bibliotek (requests, beautifulsoup4). Zainstaluj: pip install requests beautifulsoup4"}), 500

    data = request.json
    url = data.get("url", "")
    session_id = data.get("session_id", str(uuid.uuid4())[:8])

    if not url or "otodom.pl" not in url:
        return jsonify({"error": "Podaj prawidlowy link z Otodom.pl"}), 400

    try:
        session = req.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"macOS"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "Referer": "https://www.google.com/",
        })

        # First hit homepage to get cookies
        session.get("https://www.otodom.pl/", timeout=10)

        resp = session.get(url, timeout=15)

        # 403/5xx = blocked, but 410 (expired listing) still has data
        if resp.status_code == 403:
            return jsonify({"error": "Otodom zablokował zapytanie (403). Sprobuj ponownie za chwile."}), 500
        if resp.status_code >= 500:
            return jsonify({"error": f"Otodom zwrocil blad serwera ({resp.status_code})."}), 500

        soup = BeautifulSoup(resp.text, "html.parser")

        # Try __NEXT_DATA__ first (Otodom uses Next.js)
        script = soup.find("script", id="__NEXT_DATA__")
        result = None

        if script:
            try:
                next_data = json.loads(script.string)
                ad = next_data.get("props", {}).get("pageProps", {}).get("ad", {})
                if not ad:
                    ad = next_data.get("props", {}).get("pageProps", {}).get("advert", {})
                if ad:
                    result = extract_otodom_data(ad)
            except (json.JSONDecodeError, KeyError):
                pass

        if not result:
            result = extract_from_html(soup)

        # Download photos
        session_dir = UPLOADS_DIR / session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        photo_paths = []
        for i, photo_url in enumerate(result.get("photo_urls", [])[:5]):
            try:
                photo_resp = session.get(photo_url, timeout=10)
                photo_resp.raise_for_status()
                ext = ".jpg"
                photo_name = f"otodom_{i+1}{ext}"
                photo_path = session_dir / photo_name
                photo_path.write_bytes(photo_resp.content)
                rel_path = f"uploads/{session_id}/{photo_name}"
                photo_paths.append({"name": photo_name, "path": rel_path})
            except Exception:
                continue

        result["photos"] = photo_paths
        result.pop("photo_urls", None)
        result["session_id"] = session_id

        return jsonify(result)

    except req.exceptions.Timeout:
        return jsonify({"error": "Timeout — Otodom nie odpowiada. Sprobuj ponownie."}), 500
    except req.exceptions.HTTPError as e:
        return jsonify({"error": f"Otodom zwrocil blad {e.response.status_code}. Sprawdz czy link jest prawidlowy."}), 500
    except Exception as e:
        return jsonify({"error": f"Nie udalo sie pobrac danych: {str(e)}"}), 500


def extract_otodom_data(ad):
    """Extract listing data from Otodom __NEXT_DATA__ ad object"""
    result = {
        "title": ad.get("title", ""),
        "price": "",
        "location": "",
        "area": "",
        "rooms": "",
        "floor": "",
        "year": "",
        "features": [],
        "photo_urls": [],
    }

    # Location
    loc = ad.get("location", {})
    if isinstance(loc, dict):
        addr = loc.get("address", {})
        parts = []
        for key in ["city", "district", "street"]:
            val = addr.get(key, {})
            if isinstance(val, dict) and val.get("name"):
                parts.append(val["name"])
            elif isinstance(val, str) and val:
                parts.append(val)
        result["location"] = ", ".join(parts)

    # Price
    target = ad.get("target", {})
    price = target.get("Price") or ad.get("price", {}).get("value")
    if price:
        try:
            result["price"] = f"{int(float(price)):,} PLN".replace(",", " ")
        except (ValueError, TypeError):
            result["price"] = str(price)

    # Characteristics
    chars = ad.get("characteristics", [])
    if isinstance(chars, list):
        for char in chars:
            key = char.get("key", "")
            value = str(char.get("value", ""))
            if key == "m" and value:
                result["area"] = f"{value} m2"
            elif key == "rooms_num" and value:
                try:
                    n = int(float(value))
                    result["rooms"] = f"{n} {'pokoje' if 2 <= n <= 4 else 'pokoi'}"
                except ValueError:
                    result["rooms"] = value
            elif key == "floor_no" and value:
                result["floor"] = f"pietro {value}"
            elif key == "build_year" and value:
                result["year"] = value

    # Features
    for cat in ad.get("featuresByCategory", []):
        if isinstance(cat, dict):
            for feat in cat.get("features", []):
                if isinstance(feat, str):
                    result["features"].append(feat)

    # Photos
    for img in ad.get("images", []):
        if isinstance(img, dict):
            url = img.get("large") or img.get("medium") or img.get("small")
            if url:
                result["photo_urls"].append(url)

    return result


def extract_from_html(soup):
    """Fallback: extract from HTML meta tags"""
    result = {
        "title": "",
        "price": "",
        "location": "",
        "area": "",
        "rooms": "",
        "floor": "",
        "year": "",
        "features": [],
        "photo_urls": [],
    }

    og_title = soup.find("meta", property="og:title")
    if og_title:
        result["title"] = og_title.get("content", "")

    og_desc = soup.find("meta", property="og:description")
    if og_desc:
        desc = og_desc.get("content", "")
        # Try to extract price from description
        price_match = re.search(r'(\d[\d\s]*)\s*(?:PLN|zł|zl)', desc)
        if price_match:
            result["price"] = price_match.group(0).strip()

    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        result["photo_urls"].append(og_image["content"])

    # Try to find more images
    for img in soup.find_all("img", src=True):
        src = img["src"]
        if "apollo.olxcdn.com" in src or "img.otodom.pl" in src:
            if src not in result["photo_urls"]:
                result["photo_urls"].append(src)

    return result


def parse_effects_description(text: str) -> dict:
    """Parse free-text description into effects params"""
    text = text.lower().strip()
    effects = {
        "tempo": "normal",
        "textPosition": "center",
        "transition": "slide",
        "overlay": "dark",
    }

    # Tempo
    if any(w in text for w in ["szybk", "dynamiczn", "krotk", "fast", "energiczn"]):
        effects["tempo"] = "fast"
    elif any(w in text for w in ["woln", "spokoj", "slow", "powol", "delikat"]):
        effects["tempo"] = "slow"

    # Text position
    if any(w in text for w in ["na dole", "na dol", "dolna", "bottom", "pod spodem"]):
        effects["textPosition"] = "bottom"
    elif any(w in text for w in ["na gorze", "gora", "top", "u gory"]):
        effects["textPosition"] = "top"

    # Transition
    if any(w in text for w in ["przenikani", "fade", "rozpływa", "lagod"]):
        effects["transition"] = "fade"
    elif any(w in text for w in ["zoom", "przybliz", "zbliz"]):
        effects["transition"] = "zoom"
    elif any(w in text for w in ["przesuw", "slide", "wjezd"]):
        effects["transition"] = "slide"

    # Overlay
    if any(w in text for w in ["jasn", "light", "lekk"]):
        effects["overlay"] = "light"
    elif any(w in text for w in ["brak overlay", "bez overlay", "bez nakl", "none", "czyst"]):
        effects["overlay"] = "none"
    elif any(w in text for w in ["kinow", "cinem", "filmow", "vignet"]):
        effects["overlay"] = "cinematic"
    elif any(w in text for w in ["gradient", "kolorow"]):
        effects["overlay"] = "gradient"

    return effects


@app.route("/cleanup", methods=["POST"])
def cleanup():
    """Wyczyść stare pliki renderowania"""
    data = request.json or {}
    session_id = data.get("session_id")

    if session_id:
        # Wyczyść uploads dla sesji
        session_dir = UPLOADS_DIR / session_id
        if session_dir.exists():
            shutil.rmtree(str(session_dir))

    return jsonify({"success": True})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5558))
    print("=" * 50)
    print("  KREATOR WIDEO NIERUCHOMOSCI")
    print(f"  http://localhost:{port}")
    print("=" * 50)
    app.run(host="0.0.0.0", port=port, debug=False)
