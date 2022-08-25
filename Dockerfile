FROM scratch
ADD x86_64/1a928e0253bdadbb10ea75e29d29f638b8c1bef3b7cf91b03430e4c9d47d5370.tar.xz /
ADD x86_64/82ed88c6f9e0b2022bc773435d4b384202e1d1fd24dba4f12b2908eb0e7c5a77.tar.xz /
ADD x86_64/cfbb234325fda4e3eebaa9793a55b77d7d48f458bd2e4c2f799c492b325cbbd7.tar.xz /
ADD x86_64/ede4f2647cff5b96ace109ca996d7a08aab8bf1345f3c69a4a942c2b8d4008f6.tar.xz /

ENV LANG=en_US.UTF-8
ENV TZ=:/etc/localtime
ENV PATH=/var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin
ENV LD_LIBRARY_PATH=/var/lang/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib
ENV LAMBDA_TASK_ROOT=/var/task
ENV LAMBDA_RUNTIME_DIR=/var/runtime

WORKDIR /atenea-scrapy-app

COPY . .

RUN yarn install