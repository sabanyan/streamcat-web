from ...api.utils import Status

def make_response(request, template_name:str, is_preview:bool=False, status_code:Status=Status.OK, **context):
    """
    Jinja2のテンプレートからHTMLレスポンスを作成する
    """
    import uuid
    from ... import SCatTemplates, DEBUG_BUILD, SECURITY_LEVEL

    def make_bokeh_script(nonce):
        """
        Bokehが使用するJavaScriptにnonce値を設定する
        """
        from bokeh.resources import CDN
        # CDN : Content Delivery Network
        render_js = ''
        for file_path in CDN.js_files:
            render_js += f'<script src="{file_path}" nonce="{nonce}" crossorigin="anonymous"></script>'
        return render_js

    # Nonce値を生成する
    nonce = str(uuid.uuid4()).upper()[0:6]

    # プレビューの場合はBokehスクリプトを作成する
    if is_preview:
        render_js = make_bokeh_script(nonce)
    else:
        render_js = ''

    # 二つのDictをマージする
    # NOTE: contextにrequestを含めないとTemplateResponse()から例外が送出される
    context = context | {'request':request, 'nonce':nonce, 'js_resources':render_js}
    # HTMLレスポンスを作成する
    response = SCatTemplates.TemplateResponse(template_name, status_code=status_code, context=context)

    # ログアウト後に戻る押下で前画面が表示されないようにするため
    # HTMLレスポンスがWebブラウザのbfcacheにキャッシュされるのを防ぐ
    response.headers['Cache-Control'] = 'no-store'

    if DEBUG_BUILD:
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
