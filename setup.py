from setuptools import setup

setup(
    name='kskp.web',
    packages=['kskp.web'],
    version='3.0',
    description='Web Frontend of KSKP',
    url='https://www.kskp.io',
    include_package_data=True,
    install_requires=[
        # テストスクリプトで用いているFlaskのtemplate_renderedが使用する
        'blinker',
        'Flask',
        # 'flask_mail',
        'oauthlib',
        'PyJWT',
    ],
)
