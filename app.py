import os
import pandas as pd
from flask import Flask, request, jsonify, render_template

from binary_search import binary_search, df as bs_df
from trie import trie
from kmp import kmp_search, df as raw_df

app = Flask(__name__, template_folder="templates", static_folder="static")

# Medical dataset references
# bs_df is already sorted by Disease Name in binary_search.py
# raw_df is the dataset in kmp.py / trie.py


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/autocomplete", methods=["GET"])
def autocomplete():
    prefix = request.args.get("prefix", "").strip()
    if not prefix:
        return jsonify({"suggestions": []})

    suggestions = trie.autocomplete(prefix)
    # Remove duplicates if any while preserving order
    unique_suggestions = list(dict.fromkeys(suggestions))
    return jsonify({"suggestions": unique_suggestions})


@app.route("/api/search/disease", methods=["GET"])
def search_disease():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({
            "found": False,
            "algorithm": "Binary Search",
            "comparisons": 0,
            "disease": None,
            "message": "Please enter a disease name."
        }), 400

    idx, comparisons = binary_search(bs_df, query)

    if idx != -1:
        row = bs_df.iloc[idx]
        disease_data = {
            "Disease_ID": str(row["Disease_ID"]),
            "Disease Name": str(row["Disease Name"]),
            "Symptoms": str(row["Symptoms"]),
            "Causes": str(row["Causes"]),
            "Treatment": str(row["Treatment"]),
            "Prevention": str(row["Prevention"]),
            "Associated_Medicine": str(row["Associated_Medicine"])
        }
        return jsonify({
            "found": True,
            "algorithm": "Binary Search",
            "comparisons": comparisons,
            "disease": disease_data
        })
    else:
        return jsonify({
            "found": False,
            "algorithm": "Binary Search",
            "comparisons": comparisons,
            "disease": None,
            "message": "No Disease Found"
        })


@app.route("/api/search/symptom", methods=["GET"])
def search_symptom():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({
            "found": False,
            "algorithm": "KMP",
            "keyword": "",
            "matching_records": 0,
            "total_comparisons": 0,
            "results": [],
            "message": "Please enter a symptom or keyword."
        }), 400

    matching_records = 0
    total_comparisons = 0
    results = []

    for _, row in raw_df.iterrows():
        symptoms = str(row["Symptoms"])
        matched, comps = kmp_search(symptoms, query)
        total_comparisons += comps
        if matched:
            matching_records += 1
            results.append({
                "Disease_ID": str(row["Disease_ID"]),
                "Disease Name": str(row["Disease Name"]),
                "Symptoms": str(row["Symptoms"]),
                "Causes": str(row["Causes"]),
                "Treatment": str(row["Treatment"]),
                "Prevention": str(row["Prevention"]),
                "Associated_Medicine": str(row["Associated_Medicine"]),
                "comparisons": comps
            })

    return jsonify({
        "found": matching_records > 0,
        "algorithm": "KMP",
        "keyword": query,
        "matching_records": matching_records,
        "total_comparisons": total_comparisons,
        "results": results
    })


@app.route("/api/search/smart", methods=["GET"])
def smart_search():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({
            "found": False,
            "algorithm": "Smart Search",
            "message": "Please enter a disease, symptom, or keyword."
        }), 400

    # Step 1: Check exact disease match using Binary Search
    idx, bs_comparisons = binary_search(bs_df, query)
    if idx != -1:
        row = bs_df.iloc[idx]
        return jsonify({
            "found": True,
            "search_type": "disease",
            "algorithm": "Binary Search",
            "comparisons": bs_comparisons,
            "disease": {
                "Disease_ID": str(row["Disease_ID"]),
                "Disease Name": str(row["Disease Name"]),
                "Symptoms": str(row["Symptoms"]),
                "Causes": str(row["Causes"]),
                "Treatment": str(row["Treatment"]),
                "Prevention": str(row["Prevention"]),
                "Associated_Medicine": str(row["Associated_Medicine"])
            }
        })

    # Step 2: If not found as exact disease, run KMP keyword search on Symptoms
    matching_records = 0
    total_comparisons = 0
    results = []

    for _, row in raw_df.iterrows():
        symptoms = str(row["Symptoms"])
        matched, comps = kmp_search(symptoms, query)
        total_comparisons += comps
        if matched:
            matching_records += 1
            results.append({
                "Disease_ID": str(row["Disease_ID"]),
                "Disease Name": str(row["Disease Name"]),
                "Symptoms": str(row["Symptoms"]),
                "Causes": str(row["Causes"]),
                "Treatment": str(row["Treatment"]),
                "Prevention": str(row["Prevention"]),
                "Associated_Medicine": str(row["Associated_Medicine"]),
                "comparisons": comps
            })

    if matching_records > 0:
        return jsonify({
            "found": True,
            "search_type": "symptom",
            "algorithm": "KMP",
            "keyword": query,
            "matching_records": matching_records,
            "total_comparisons": total_comparisons,
            "results": results
        })

    # Neither matched
    return jsonify({
        "found": False,
        "search_type": "none",
        "algorithm": "Binary Search & KMP",
        "bs_comparisons": bs_comparisons,
        "kmp_comparisons": total_comparisons,
        "message": "No Matching Medical Information Found"
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
