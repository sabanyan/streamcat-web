def make_response(template_name, **context):
    """
    Jinja2のテンプレートからFlaskのHTMLレスポンスを作成する
    """
    import uuid
    from flask import render_template, make_response
    from bokeh.resources import INLINE
    from ... import FRONTEND_BUILD, SECURITY_LEVEL

    # Nonce値を生成する
    nonce = str(uuid.uuid4()).upper()[0:6]

    # bokehが使用するインラインCSSとJavaScriptにnonce値を設定する
    render_css = ''
    render_js = ''
    for css_path in INLINE.css_files:
        render_css += f'<link rel="stylesheet" href="{css_path}" type="text/css" nonce="{nonce}"/>'
    for file_path in INLINE.js_files:
        render_js += f'<script type="text/javascript" src="{file_path}" nonce="{nonce}"></script>'
    for script_str in INLINE.js_raw:
        render_js += f'<script type="text/javascript" nonce="{nonce}">' + script_str + '</script>'

    # HTMLレスポンスを作成する
    contents = render_template(template_name,
                                nonce=nonce,
                                css_resources=render_css,
                                js_resources=render_js,
                                **context)
    response = make_response(contents)

    if FRONTEND_BUILD == 'development':
        # フロントエンドをdevelopmentモードでビルドする場合はevalの使用を許可する
        unsafe_eval = "'unsafe-eval'"
    else:
        # productionモードでビルドする場合はevalの使用を許可しない
        unsafe_eval = ""

    if SECURITY_LEVEL == 0:
        # 制限に違反しても通知のみ行う
        response.headers['Content-Security-Policy-Report-Only'] = \
            f"default-src 'self'; script-src 'self' 'nonce-{nonce}' {unsafe_eval}; style-src 'self' 'unsafe-inline'"
    else:
        # 
        # TODO: フロントの対応が完了したら、-Report-Onlyを外す
        # 
        # Webブラウザに対し、コンテンツの取得元をディレクティブに従い制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/CSP
        response.headers['Content-Security-Policy-Report-Only'] = \
            f"default-src 'self'; " \
            f"script-src 'self' 'nonce-{nonce}' {unsafe_eval} ;" \
            f"style-src 'self' 'unsafe-inline' https://unpkg.com ; " \
            f"img-src 'self' data:"

        # Webブラウザに対し、<frame>,<iframe>,<embed>,<object>から取得するコンテンツを自身のドメインに制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Frame-Options
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'

    return response
