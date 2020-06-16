# start:
# 	react-scripts start

# build:
# 	react-scripts build

# test:
# 	react-scripts test

# eject:
# 	react-scripts eject

# testFrontEnd:
# 	ngrok http 3000

# startmongo:
# 	sudo docker run -d -p 27017:27017 -v /Users/ketankr9/Documents/dockerData:/data/db mongo

# graphql:
# 	ssh -R 80:localhost:8080 serveo.net

all:
	npm start

clean:
	rm -r build