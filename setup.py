from setuptools import setup

setup(
    name='streamcat.web',
    packages=['streamcat.web'],
    version='3.3.1',
    description='Web Frontend of StreamCat',
    url='https://www.kskp.io',
    include_package_data=True,
    install_requires=[
        # テストスクリプトで用いているFlaskのtemplate_renderedが使用する
        'blinker',
        'Flask',
        # watchdog>2.3.0ではFlaskのデバッグ実行時に不具合がある
        # https://github.com/pallets/werkzeug/issues/2603
        'watchdog==2.2.1',
        # 'flask_mail',
        'oauthlib',
        'PyJWT',
    ],
)
