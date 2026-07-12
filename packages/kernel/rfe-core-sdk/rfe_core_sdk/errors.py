class RFEError(RuntimeError):
    """Base SDK error carrying a stable machine-readable code."""
    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(f"{code}: {message}")

class IntegrityError(RFEError):
    pass

class ConflictError(RFEError):
    pass

class ValidationError(RFEError):
    pass
