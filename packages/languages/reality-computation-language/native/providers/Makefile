CC ?= cc
CFLAGS ?= -O2 -std=c11 -Wall -Wextra -Wpedantic
LDFLAGS ?= -lm

PHYSICS_PROVIDER := physics_provider.c
RENDER_PROVIDER := render_provider.c
TEST_SRC := test_providers.c

PHYSICS_OBJ := physics_provider.o
RENDER_OBJ := render_provider.o
TEST_OBJ := test_providers.o

TEST_BIN := test_providers

all: $(TEST_BIN)

$(PHYSICS_OBJ): $(PHYSICS_PROVIDER) ../rclvm.h
	$(CC) $(CFLAGS) -c -o $@ $(PHYSICS_PROVIDER)

$(RENDER_OBJ): $(RENDER_PROVIDER) ../rclvm.h
	$(CC) $(CFLAGS) -c -o $@ $(RENDER_PROVIDER)

$(TEST_OBJ): $(TEST_SRC) ../rclvm.h
	$(CC) $(CFLAGS) -c -o $@ $(TEST_SRC)

$(TEST_BIN): $(TEST_OBJ) $(PHYSICS_OBJ) $(RENDER_OBJ)
	$(CC) $(CFLAGS) -o $@ $(TEST_OBJ) $(PHYSICS_OBJ) $(RENDER_OBJ) $(LDFLAGS)

test: $(TEST_BIN)
	./$(TEST_BIN)

clean:
	rm -f $(PHYSICS_OBJ) $(RENDER_OBJ) $(TEST_OBJ) $(TEST_BIN)

.PHONY: all test clean
