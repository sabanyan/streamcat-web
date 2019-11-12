from setuptools import setup

setup(
    name='kskp.web',
    packages=['kskp.web'],
    include_package_data=True,
    install_requires=[
        'flask',
        'flask_mail',
        'sqlalchemy',
        'psycopg2',
        'numpy',
        'scipy',
        'pandas==0.24.2',
        'sklearn',
        'holoviews',
        'bokeh',
        'ptvsd',
        'awscli',
        'matplotlib',
        'watchdog',
        'cx_Oracle'
    ],
)
