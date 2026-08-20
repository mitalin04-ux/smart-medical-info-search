import pandas as pd

df = pd.read_csv("medical_dataset.csv")


class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.words = []


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        current = self.root

        for ch in word.lower():

            if ch not in current.children:
                current.children[ch] = TrieNode()

            current = current.children[ch]

        current.is_end = True
        current.words.append(word)

    def autocomplete(self, prefix):
        current = self.root

        for ch in prefix.lower():

            if ch not in current.children:
                return []

            current = current.children[ch]

        results = []

        def collect(node):

            if node.is_end:
                results.extend(node.words)

            for child in node.children.values():
                collect(child)

        collect(current)

        return results


trie = Trie()

for disease in df["Disease Name"]:
    trie.insert(str(disease))
