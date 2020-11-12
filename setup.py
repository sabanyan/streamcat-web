from setuptools import setup

setup(
    name='kskp.web',
    packages=['kskp.web'],
    description='Web Frontend of KSKP',
    url='https://www.ksk-anl.com/products/kskp',
    include_package_data=True,
    install_requires=[
        'flask',
        'flask_mail',
        'numpy',
        'scipy',
        # param 1.10.0では以下のWarningが多量に表示される、bokehが参照している?
        # "WARNING:param.Dimension: Use method 'get_param_values' via param namespace"
        'param<=1.9.3',
        'pandas==0.24.2',
        'sklearn',
        'holoviews==1.12.7',
        'bokeh==1.4.0',
        'ptvsd',
        'matplotlib'
    ],
)
