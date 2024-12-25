# Compiler
CC = gcc

# Directories
SRC_DIR = src
BIN_DIR = bin
INCLUDE_DIR = include

# Output executable
TARGET = $(BIN_DIR)/server

# Source files and object files
SRC_FILES = $(wildcard $(SRC_DIR)/*.c)
OBJ_FILES = $(patsubst $(SRC_DIR)/%.c, $(BIN_DIR)/%.o, $(SRC_FILES))

# Compiler flags
CFLAGS = -Wall -Wextra -I$(INCLUDE_DIR)

# Rules
all: $(TARGET)

$(TARGET): $(OBJ_FILES)
	@mkdir -p $(BIN_DIR)
	$(CC) $(OBJ_FILES) -o $(TARGET)

$(BIN_DIR)/%.o: $(SRC_DIR)/%.c $(INCLUDE_DIR)/%.h
	@mkdir -p $(BIN_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

parser: $(BIN_DIR)/parser.o

tokenizer: $(BIN_DIR)/tokenizer.o

clean:
	rm -rf $(BIN_DIR)

.PHONY: all clean parser tokenizer