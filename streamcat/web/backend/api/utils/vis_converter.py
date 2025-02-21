class VisConverter:
    """
    VisからHTMLを出力する
    """
    def __init__(self, request, vis):
        from streamcat.store import Vis, BokehPlotVis
        from ... import SCatTemplates
        from . import Status

        if isinstance(vis, BokehPlotVis):
            result = vis.result
            # NOTE: contextにrequestを含めないとTemplateResponse()から例外が送出される
            context = {'script':result['script'], 'div':result['div']}

            self.response = SCatTemplates.TemplateResponse( request,
                                                            'visualize/component.html',
                                                            status_code=Status.OK,
                                                            context=context)
        elif isinstance(vis, Vis):
            result = vis.result
            context = {'header':result['header'], 'reader':result['reader']}
            self.response = SCatTemplates.TemplateResponse( request,
                                                            'visualize/table.html',
                                                            status_code=Status.OK,
                                                            context=context)
        else:
            raise Exception(f'Visクラスを継承しないオブジェクトです')

    def to_html(self):
        return self.response.body
