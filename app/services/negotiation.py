MAX_ABOVE_RATE = 1.30  # Never pay more than 30% above loadboard rate


def evaluate_offer(loadboard_rate: float, carrier_offer: float, round_num: int) -> dict:
    max_acceptable = loadboard_rate * MAX_ABOVE_RATE
    ratio = carrier_offer / loadboard_rate

    # At or below loadboard rate — always accept
    if carrier_offer <= loadboard_rate:
        return {
            "decision": "accept",
            "counter_offer": None,
            "message": f"We accept your offer of ${carrier_offer:,.2f}.",
        }

    # Within 5% above — accept
    if ratio <= 1.05:
        return {
            "decision": "accept",
            "counter_offer": None,
            "message": f"We can work with ${carrier_offer:,.2f}. You've got a deal.",
        }

    # Final round — accept up to 30%, reject above
    if round_num >= 3:
        if carrier_offer <= max_acceptable:
            return {
                "decision": "accept",
                "counter_offer": None,
                "message": f"Final round — we'll accept ${carrier_offer:,.2f}. Let's get this booked.",
            }
        return {
            "decision": "reject",
            "counter_offer": None,
            "message": "We weren't able to reach an agreement on this one. Thanks for your time.",
        }

    # Above 30% — counter at 10% above loadboard rate
    if carrier_offer > max_acceptable:
        counter = round(loadboard_rate * 1.10, 2)
        return {
            "decision": "counter",
            "counter_offer": counter,
            "message": f"That's above our budget for this lane. The best we can do is ${counter:,.2f}.",
        }

    # Between 5-30% above — meet in the middle
    counter = round((carrier_offer + loadboard_rate) / 2, 2)
    return {
        "decision": "counter",
        "counter_offer": counter,
        "message": f"We appreciate the offer. Could you come up to ${counter:,.2f}?",
    }
