// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleERC721 {
    string public name = "PolkaDPP";
    string public symbol = "PDPP";

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string) private _tokenURIs; // Mapping for token metadata URIs

    uint256 private tokenCount; // Counter for minted tokens

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Address zero is not a valid owner");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    function mint(address to, string memory tokenURI) public {
        require(to != address(0), "Cannot mint to the zero address");

        tokenCount += 1; // Increment the token count
        uint256 tokenId = tokenCount; // Assign the new token ID

        require(_owners[tokenId] == address(0), "Token already minted");

        _balances[to] += 1;
        _owners[tokenId] = to;
        _tokenURIs[tokenId] = tokenURI; // Set the metadata URI for the token

        emit Transfer(address(0), to, tokenId);
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function getTokenCount() public view returns (uint256) {
        return tokenCount; // Return the current token count
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(from == _owners[tokenId], "Transfer not authorized");
        require(to != address(0), "Cannot transfer to the zero address");

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }
}