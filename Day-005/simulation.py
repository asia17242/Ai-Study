def calculate_metrics(m, total_books=10000, true_hp=100, search_results=200):
    if m < 0 or m > min(true_hp, search_results):
        print(f"Error: m (found books) must be between 0 and {min(true_hp, search_results)}")
        return

    # Calculations
    recall = m / true_hp
    precision = m / search_results
    
    if (precision + recall) > 0:
        f1 = 2 * (precision * recall) / (precision + recall)
    else:
        f1 = 0.0

    print("=" * 60)
    print(f"Simulation Results for m = {m} (Harry Potter books found in {search_results} results)")
    print("=" * 60)
    print(f"Recall (Sensitivity)  : {recall:.2%}  <- P(Returned | Harry Potter)")
    print(f"Precision             : {precision:.2%}  <- P(Harry Potter | Returned)")
    print(f"F1-Score              : {f1:.2%}  <- Balanced Metric")
    print("-" * 60)
    print(f"Confusion Matrix:")
    print(f"  - True Positives (TP)  : {m}")
    print(f"  - False Positives (FP) : {search_results - m}")
    print(f"  - False Negatives (FN) : {true_hp - m}")
    print(f"  - True Negatives (TN)  : {total_books - true_hp - (search_results - m)}")
    print("=" * 60)

if __name__ == "__main__":
    # You can change the value of m here to see different outcomes!
    m_found = 70
    calculate_metrics(m_found)
