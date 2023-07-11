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
        'blinker==1.6.2',
        'fastapi',
        'Flask==2.3.2',
        # 'flask_mail',
        'oauthlib==3.2.2',
        'PyJWT==2.6.0',
        # "standard"を指定して"--reload"指定によるCPUの高負荷を下げる
        'uvicorn[standard]'
    ],
)
