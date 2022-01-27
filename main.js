const { Blockchain, Transaction } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const my_key = ec.keyFromPrivate('30b56878271f1dfe313883d27d32942b77d06697af73c1c3d8312e79e896908b');
const my_wallet_address = my_key.getPublic('hex');
const ChutCoin = new Blockchain();

ChutCoin.mine_pending_transactions(my_wallet_address);

const transaction1 = new Transaction(my_wallet_address, 'address2', 100);
transaction1.sign_transaction(my_key);
ChutCoin.add_transaction(transaction1);

ChutCoin.mine_pending_transactions(my_wallet_address);

const transaction2 = new Transaction(my_wallet_address, 'address1', 50);
transaction2.sign_transaction(my_key);
ChutCoin.add_transaction(transaction2);

ChutCoin.mine_pending_transactions(my_wallet_address);

console.log();
console.log(`Balance of miner 1 is ${ChutCoin.get_address_balance(my_wallet_address)}`);

console.log();
console.log('Valid Blockchain: ', ChutCoin.is_valid_chain() ? 'Yes' : 'No');
