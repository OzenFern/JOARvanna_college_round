"""Budget Controller"""

class BudgetController:
    def __init__(self, max_attempts_per_attack: int = 3, max_total_model_calls: int = 50):
        self.max_attempts_per_attack = max_attempts_per_attack
        self.max_total_model_calls = max_total_model_calls
        self.current_calls = 0

    def can_attempt(self, attempt_count: int) -> bool:
        if attempt_count >= self.max_attempts_per_attack:
            return False
        if self.current_calls >= self.max_total_model_calls:
            return False
        return True

    def record_call(self):
        self.current_calls += 1
