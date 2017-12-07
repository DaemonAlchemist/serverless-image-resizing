.PHONY: all image package dist clean

all: package

image:
	sudo docker build --tag amazonlinux:nodejs .

package: image
	sudo docker run --rm --volume ${PWD}:/build amazonlinux:nodejs npm run build

dist: package
	cd lib && sudo zip -FS -q -r ../serverless-image-resizing.zip *

clean:
	rm -r lambda/node_modules
	docker rmi --force amazonlinux:nodejs
