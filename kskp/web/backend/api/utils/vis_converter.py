class VisConverter:
    """
    VisからHTMLを出力する
    """
    def __init__(self, vis):
        from flask import render_template
        from kskp.store import Vis, BokehPlotVis

        if isinstance(vis, BokehPlotVis):
            result = vis.result
            self.response = render_template('visualize/component.html', 
                                            script=result['script'],
                                            div=result['div'])
        elif isinstance(vis, Vis):
            result = vis.result
            self.response = render_template('visualize/table.html', 
                                            header=result['header'],
                                            reader=result['reader'])
        else:
            raise Exception(f'Visクラスを継承しないオブジェクトです')

    def to_html(self):
        return self.response
