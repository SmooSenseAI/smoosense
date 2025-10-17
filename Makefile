SUB_PROJECTS := smoosense-gui smoosense-py

.PHONY: env build test

.EXPORT_ALL_VARIABLES:
R2_PARAMS := --profile=r2 --endpoint-url=https://41a336bea9a67c844e5fcba526c53768.r2.cloudflarestorage.com
R2_BUCKET := s3://smoosense-cdn


upload-public:
	for file in ${PWD}/smoosense-gui/_public/*; do \
		if [ -f "$$file" ]; then \
			aws ${R2_PARAMS} s3 cp "$$file" ${R2_BUCKET}/; \
		fi; \
	done

build-sync:
	(rm -rf smoosense-py/smoosense/statics)
	cp -r smoosense-gui/dist smoosense-py/smoosense/statics

build-local:
	ASSET_PREFIX= make -C smoosense-gui build
	make build-sync
	make -C smoosense-py build

build-release:
	ASSET_PREFIX=https://cdn.smoosense.ai make -C smoosense-gui build
	#make upload-public
	aws ${R2_PARAMS} s3 sync ${PWD}/smoosense-gui/dist/_next/static ${R2_BUCKET}/_next/static
	rm -rf ${PWD}/smoosense-gui/dist/_next/static
	make build-sync

env:
	for project in $(SUB_PROJECTS); do \
		make -C $$project env; \
	done

test:
	for project in $(SUB_PROJECTS); do \
		make -C $$project test; \
	done
	make build-release
	make -C smoosense-py integration-test

publish:
	make -C smoosense-py publish
