import unittest
import json
from binary_search import binary_search, df as bs_df
from trie import trie
from kmp import kmp_search, df as raw_df
from app import app


class TestSmartMedicalSearch(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def test_trie_autocomplete(self):
        print("\n--- Testing Trie Autocomplete ---")
        test_cases = ["a", "ch", "di", "p", "dia"]
        for prefix in test_cases:
            results = trie.autocomplete(prefix)
            print(f"Trie prefix '{prefix}': {results}")
            self.assertIsInstance(results, list)
            if prefix == "dia":
                self.assertIn("Diabetes Mellitus", results)
            elif prefix == "ch":
                self.assertTrue(any("ch" in r.lower() for r in results))

    def test_binary_search(self):
        print("\n--- Testing Binary Search ---")
        test_cases = [
            ("Diabetes Mellitus", True),
            ("diabetes", True),
            ("Asthma", True),
            ("asthma", True),
            ("Pneumonia", True),
            ("XYZ Disease", False)
        ]
        for query, expected_found in test_cases:
            idx, comps = binary_search(bs_df, query)
            print(f"Binary Search '{query}': idx={idx}, comparisons={comps}")
            if expected_found:
                self.assertNotEqual(idx, -1)
                disease_name = bs_df.iloc[idx]["Disease Name"]
                print(f"  -> Found: {disease_name}")
            else:
                self.assertEqual(idx, -1)
            self.assertGreater(comps, 0)

    def test_kmp_search(self):
        print("\n--- Testing KMP Search ---")
        test_cases = ["fever", "cough", "headache", "fatigue", "joint pain", "xyz"]
        for keyword in test_cases:
            matching_diseases = []
            total_comps = 0
            for _, row in raw_df.iterrows():
                matched, comps = kmp_search(str(row["Symptoms"]), keyword)
                total_comps += comps
                if matched:
                    matching_diseases.append(row["Disease Name"])
            print(f"KMP keyword '{keyword}': matched={len(matching_diseases)}, total_comps={total_comps}")
            print(f"  -> Diseases: {matching_diseases}")
            if keyword == "xyz":
                self.assertEqual(len(matching_diseases), 0)
            else:
                self.assertGreater(len(matching_diseases), 0)
            self.assertGreater(total_comps, 0)

    def test_flask_endpoints(self):
        print("\n--- Testing Flask Endpoints ---")
        
        # 1. Autocomplete
        res = self.app.get("/api/autocomplete?prefix=dia")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("suggestions", data)
        self.assertIn("Diabetes Mellitus", data["suggestions"])
        print(f"GET /api/autocomplete?prefix=dia -> {data}")

        # 2. Disease search
        res = self.app.get("/api/search/disease?query=diabetes")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["found"])
        self.assertEqual(data["algorithm"], "Binary Search")
        self.assertEqual(data["disease"]["Disease Name"], "Diabetes Mellitus")
        print(f"GET /api/search/disease?query=diabetes -> found={data['found']}, comps={data['comparisons']}")

        # 3. Symptom search
        res = self.app.get("/api/search/symptom?query=fever")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["found"])
        self.assertEqual(data["algorithm"], "KMP")
        self.assertGreater(data["matching_records"], 0)
        self.assertGreater(data["total_comparisons"], 0)
        print(f"GET /api/search/symptom?query=fever -> matches={data['matching_records']}, comps={data['total_comparisons']}")

        # 4. Smart search
        res = self.app.get("/api/search/smart?query=Asthma")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["found"])
        self.assertEqual(data["search_type"], "disease")

        res = self.app.get("/api/search/smart?query=fever")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(data["found"])
        self.assertEqual(data["search_type"], "symptom")

        # 5. Validation / Edge cases
        res = self.app.get("/api/search/disease?query=   ")
        self.assertEqual(res.status_code, 400)

        res = self.app.get("/api/search/symptom?query=   ")
        self.assertEqual(res.status_code, 400)


if __name__ == "__main__":
    unittest.main()
