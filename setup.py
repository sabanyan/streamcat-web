from setuptools import setup

setup(
    name='kskp',
    packages=['kskp'],
    include_package_data=True,
    install_requires=[
        'flask',
        'flask_mail',
        'sqlalchemy',
        'flask_sqlalchemy',        
        'numpy',
        'scipy',
        'pandas',
        'sklearn',
        'matplotlib',
        'bs4',
        'holoviews',
        'bokeh',
        'ptvsd'
    ],
)
