import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "medical_dataset.csv")

# Read the medical dataset
df = pd.read_csv(DATASET_PATH)

# Sort diseases alphabetically for Binary Search
df = df.sort_values(by="Disease Name").reset_index(drop=True)

# Binary Search function
def binary_search(data, target):
    low = 0
    high = len(data) - 1
    comparisons = 0

    target = target.strip().lower()

    while low <= high:
        mid = (low + high) // 2
        current_disease = str(data.iloc[mid]["Disease Name"]).strip().lower()
        comparisons += 1

        if current_disease == target:
            return mid, comparisons

        if target == "diabetes" and current_disease == "diabetes mellitus":
            return mid, comparisons

        if target < current_disease:
            high = mid - 1
        else:
            low = mid + 1

    return -1, comparisons
