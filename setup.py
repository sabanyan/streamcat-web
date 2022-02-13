from setuptools import setup

setup(
    name='streamcat.web',
    packages=['streamcat.web'],
    version='3.1',
    description='Web Frontend of StreamCat',
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
