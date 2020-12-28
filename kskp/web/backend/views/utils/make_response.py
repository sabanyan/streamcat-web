def make_response(template_name, **context):
    """
    Jinja2のテンプレートからFlaskのHTMLレスポンスを作成する
    """
    import uuid
    from flask import render_template, make_response
    from bokeh.resources import INLINE
    from ... import SECURITY_LEVEL

    # Nonce値を生成する
    nonce = str(uuid.uuid4()).upper()[0:6]

    # HTMLレスポンスを作成する
    contents = render_template(template_name,
                                nonce=nonce,
                                js_resources=INLINE.render_js(),
                                css_resources=INLINE.render_css(),
                                **context)
    response = make_response(contents)

    if SECURITY_LEVEL >= 1:
        # Webブラウザに対し、コンテンツの取得元をディレクティブに従い制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/CSP
        response.headers['Content-Security-Policy-Report-Only'] = \
            f"default-src 'self'; script-src 'self' 'nonce-{nonce}' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"

        # Webブラウザに対し、<frame>,<iframe>,<embed>,<object>から取得するコンテンツを自身のドメインに制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Frame-Options
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'

    return response
