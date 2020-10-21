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
        'pandas==0.24.2',
        'sklearn',
        'holoviews==1.12.7',
        'bokeh==1.4.0',
        'ptvsd',
        'matplotlib'
    ],
)
