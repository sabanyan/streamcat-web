from setuptools import setup

setup(
    name='streamcat.web',
    packages=['streamcat.web'],
    version='3.3.3',
    description='Web Frontend of StreamCat',
    url='https://www.kskp.io',
    include_package_data=True,
    install_requires=[
        # テストスクリプトで用いているFlaskのtemplate_renderedが使用する
        'blinker==1.6.3',
        'Flask==2.3.2',
        # 'flask_mail',
        'oauthlib==3.2.2',
        'PyJWT==2.8.0',
    ],
)
