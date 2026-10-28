#!/bin/sh
# Node's inspector is always listening, so an IDE can attach at any time.
# fghj sets FGHJ_DEBUG_WAIT only when you flip "halt at startup" for this
# container, and then it waits for the IDE before running a line.
set -e
flag="--inspect=0.0.0.0:9229"
[ -n "$FGHJ_DEBUG_WAIT" ] && flag="--inspect-brk=0.0.0.0:9229"
export NODE_OPTIONS="$flag ${NODE_OPTIONS:-}"
exec "$@"
