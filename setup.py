from setuptools import setup

setup(
    name='kskp.web',
    packages=['kskp.web'],
    include_package_data=True,
    install_requires=[
        'flask',
        'flask_mail',
    ],
)