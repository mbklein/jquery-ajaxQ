JQ = jquery.ajaxQ.js
JQ_MIN = jquery.ajaxQ.min.js
COMPILER = closure --js ${JQ} > ${JQ_MIN}

all: min

min:
	@@${COMPILER}
