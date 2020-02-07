from setuptools import setup

setup(
    name='kskp.web',
    packages=['kskp.web'],
    include_package_data=True,
    install_requires=[
        'flask',
        'flask_mail',
        'numpy',
        'scipy',
        'pandas==0.24.2',
        'sklearn',
        'holoviews',
        'bokeh',
        'ptvsd',
        'matplotlib'
    ],
)
