from setuptools import setup

setup(
    name='streamcat.web',
    packages=['streamcat.web'],
    version='3.4',
    description='Web Frontend of StreamCat',
    url='https://www.kskp.io',
    include_package_data=True,
    install_requires=[
        # テストスクリプトで用いているFlaskのtemplate_renderedが使用する
        'blinker==1.9.0',
        'Flask==3.1.0',
        # 'flask_mail',
        'oauthlib==3.2.2',
        'PyJWT==2.10.1',
    ],
)
