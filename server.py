#!/usr/bin/env python3
"""Kreator Wideo Nieruchomości — Flask server (port 5558)"""

import os
import json
import uuid
import subprocess
import shutil
import zipfile
from pathlib import Path
from flask import Flask, request, jsonify, send_file, render_template

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
