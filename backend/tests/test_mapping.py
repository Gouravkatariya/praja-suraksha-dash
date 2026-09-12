from app.mapping import normalize_risk_level, signal_origin


def test_risk_level_normalization():
    assert normalize_risk_level("LOW_RISK") == "LOW"
    assert normalize_risk_level("MEDIUM_RISK") == "MEDIUM"
    assert normalize_risk_level("HIGH_RISK") == "HIGH"
    assert normalize_risk_level("HIGH") == "HIGH"
    assert normalize_risk_level("something") == "UNKNOWN"
    assert normalize_risk_level(None) == "UNKNOWN"


def test_signal_origin():
    assert signal_origin("COST_OUTLIER") == "REAL_MPLADS_RULE"
    assert signal_origin("IDA_PENDING") == "REAL_MPLADS_RULE"
    assert signal_origin("STUCK_IN_LIMBO") == "REAL_MPLADS_RULE"
    assert signal_origin("COST_OVERRUN") == "SYNTHETIC_VALIDATION"
    assert signal_origin("DELAY") == "SYNTHETIC_VALIDATION"
