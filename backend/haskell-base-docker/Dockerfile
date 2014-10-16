# build with
#  docker build -t 'necrobious/haskell-ghc-7.8-64' .
 
FROM ubuntu:14.04
  
####### Install Dependencies ###################################################
RUN apt-get -y update
RUN apt-get -y install build-essential curl zlib1g-dev libgmp3-dev libedit2
 
####### GHC 7.8.3 offical ######################################################
RUN curl -O http://www.haskell.org/ghc/dist/7.8.3/ghc-7.8.3-x86_64-unknown-linux-deb7.tar.bz2
RUN tar xvfj ghc-7.8.3-x86_64-unknown-linux-deb7.tar.bz2
RUN cd ghc-7.8.3 && ./configure
RUN cd ghc-7.8.3 && make install
RUN ghc --version
 
######### cabal-install ########################################################
RUN curl -O http://hackage.haskell.org/package/cabal-install-1.20.0.3/cabal-install-1.20.0.3.tar.gz
RUN tar xvfz cabal-install-1.20.0.3.tar.gz
RUN (cd cabal-install-1.20.0.3 && ./bootstrap.sh)
ENV PATH /.cabal/bin:$PATH
ENV LANG C.UTF-8
 
######### Clean up #############################################################
RUN rm -fr ghc-7.8.3-x86_64-unknown-linux-deb7.tar.bz2 ghc-7.8.3
RUN rm -fr cabal-install-1.20.0.3*