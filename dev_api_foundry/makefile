-include .env

.PHONY: all clean remove install update build help deploy

DEFAULT_ANVIL_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

help:
	@echo "Usage: make deploy [network]"

all: clean remove install update build

# Clean the repo
clean  :; forge clean

# Remove modules
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

#install dependencies
install :; forge soldeer update

# Update Dependencies
update:; forge update

#build the project
build:; forge build

anvil:; anvil --block-time 10

NETWORK_ARGS := --rpc-url http://localhost:8545 --private-key $(DEFAULT_ANVIL_KEY) --broadcast

ifeq ($(findstring --network sepolia,$(ARGS)),--network sepolia)
	NETWORK_ARGS := --rpc-url $(SEPOLIA_RPC_URL) --account sepolia_one --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv
endif

ifeq ($(findstring --network cardona,$(ARGS)),--network cardona)
	NETWORK_ARGS := --rpc-url $(CARDONA_RPC_URL) --account cardona_one --broadcast 
endif

ifeq ($(findstring --network polyzkevm,$(ARGS)),--network polyzkevm)
	NETWORK_ARGS := --rpc-url $(POLYZKEVM_RPC_URL) --account polyzkevm_one --broadcast 
endif


deploy:
	@forge script script/DeployTVoting.s.sol:DeployTVoting $(NETWORK_ARGS)