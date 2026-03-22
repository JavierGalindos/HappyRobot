from app.config import settings


def evaluate_offer(loadboard_rate: float, carrier_offer: float, round_num: int) -> dict:
    offered_rate = round(loadboard_rate * settings.initial_offer_margin)

    # At or below our initial offer — always accept (best case for us)
    if carrier_offer <= offered_rate:
        return {
            "decision": "accept",
            "counter_offer": None,
            "message": f"We accept your offer of ${carrier_offer:,.0f}.",
        }

    # Within 5% above our offered rate — accept
    if carrier_offer <= offered_rate * 1.05:
        return {
            "decision": "accept",
            "counter_offer": None,
            "message": f"We can work with ${carrier_offer:,.0f}. You've got a deal.",
        }

    max_acceptable = round(loadboard_rate * 1.10)

    # Above max acceptable — too high
    if carrier_offer > max_acceptable:
        if round_num >= 3:
            return {
                "decision": "reject",
                "counter_offer": None,
                "message": "We weren't able to reach an agreement on this one. Thanks for your time.",
            }
        counter = round(offered_rate * 1.05)
        return {
            "decision": "counter",
            "counter_offer": counter,
            "message": f"That's above our budget for this lane. The best we can do is ${counter:,.0f}.",
        }

    # Final round — accept up to loadboard_rate + 10%
    if round_num >= 3:
        return {
            "decision": "accept",
            "counter_offer": None,
            "message": f"Final round — we'll accept ${carrier_offer:,.0f}. Let's get this booked.",
        }

    # Between offered_rate and loadboard_rate — meet in the middle
    counter = round((carrier_offer + offered_rate) / 2)
    return {
        "decision": "counter",
        "counter_offer": counter,
        "message": f"We appreciate the offer. Could you come down to ${counter:,.0f}?",
    }
