def make_response(template_name, is_preview:bool=False, **context):
    """
    Jinja2のテンプレートからFlaskのHTMLレスポンスを作成する
    """
    import uuid
    from flask import render_template, make_response
    from ... import FRONTEND_BUILD, SECURITY_LEVEL

    def make_bokeh_script(nonce):
        """
        Bokehが使用するJavaScriptにnonce値を設定する
        """
        from bokeh.resources import CDN
        render_js = ''
        for file_path in CDN.js_files:
            render_js += f'<script type="text/javascript" src="{file_path}" nonce="{nonce}"></script>'
        return render_js

    # Nonce値を生成する
    nonce = str(uuid.uuid4()).upper()[0:6]

    # プレビューの場合はBokehスクリプトを作成する
    if is_preview:
        render_js = make_bokeh_script(nonce)
    else:
        render_js = ''

    # HTMLレスポンスを作成する
    contents = render_template(template_name,
                                nonce=nonce,
                                js_resources=render_js,
                                **context)
    response = make_response(contents)

    if FRONTEND_BUILD == 'development':
        # フロントエンドをdevelopmentモードでビルドする場合はevalの使用を許可する
        unsafe_eval = "'unsafe-eval'"
    else:
        # productionモードでビルドする場合はevalの使用を許可しない
        unsafe_eval = ""

    # Content-Security-Policyの設定を作成する
    csp_directive = f"default-src 'self';" \
                    f"script-src 'self' 'nonce-{nonce}' {unsafe_eval} ;" \
                    f"style-src  'self' 'unsafe-inline' https://unpkg.com ;" \
                    f"img-src 'self' data:"

    if SECURITY_LEVEL == 0:
        # 制限に違反しても通知のみ行う
        response.headers['Content-Security-Policy-Report-Only'] = csp_directive
    else:
        # 
        # TODO: フロントの対応が完了したら、-Report-Onlyを外す
        # 
        # Webブラウザに対し、コンテンツの取得元をディレクティブに従い制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/CSP
        response.headers['Content-Security-Policy-Report-Only'] = csp_directive
        # Webブラウザに対し、<frame>,<iframe>,<embed>,<object>から取得するコンテンツを自身のドメインに制限するよう要求する
        # https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Frame-Options
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'

    return response
