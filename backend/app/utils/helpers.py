from flask import jsonify


def success_response(data=None, message="Succès", status_code=200):
    return jsonify({"success": True, "message": message, "data": data}), status_code


def error_response(message="Erreur", status_code=400, errors=None):
    body = {"success": False, "message": message}
    if errors:
        body["errors"] = errors
    return jsonify(body), status_code


def paginate_query(query, page, per_page=10):
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items":      [item.to_dict() for item in pagination.items],
        "total":      pagination.total,
        "pages":      pagination.pages,
        "page":       pagination.page,
        "per_page":   pagination.per_page,
        "has_next":   pagination.has_next,
        "has_prev":   pagination.has_prev,
    }
