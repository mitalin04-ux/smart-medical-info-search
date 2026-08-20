import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "medical_dataset.csv")

# Read the medical dataset
df = pd.read_csv(DATASET_PATH)


# KMP - LPS (Longest Prefix Suffix) function
def compute_lps(pattern):
    lps = [0] * len(pattern)

    length = 0
    i = 1

    while i < len(pattern):

        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1

        else:
            if length != 0:
                length = lps[length - 1]
            else:
                lps[i] = 0
                i += 1

    return lps


# KMP Search function
def kmp_search(text, pattern):
    text = str(text).strip().lower()
    pattern = pattern.strip().lower()

    comparisons = 0

    if pattern == "":
        return False, comparisons

    lps = compute_lps(pattern)

    i = 0
    j = 0

    while i < len(text):

        comparisons += 1

        if text[i] == pattern[j]:
            i += 1
            j += 1

            if j == len(pattern):
                return True, comparisons

        else:
            if j != 0:
                j = lps[j - 1]
            else:
                i += 1

    return False, comparisons
