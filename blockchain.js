const crypto = require('crypto');
const elliptic = require('elliptic').ec;
const ec = new elliptic('secp256k1');

class Transaction {
    constructor(sender_address, recipient_address, amount) {
        this.sender_address = sender_address;
        this.recipient_address = recipient_address;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    calculate_hash() {
        return crypto.createHash('sha256').update(this.sender_address + this.recipient_address + this.amount + this.timestamp).digest('hex');
    }

    sign_transaction(signing_key) {
        if (signing_key.getPublic('hex') !== this.sender_address) {
            throw new Error('Invalid Transaction Signature!');
        }

        const transaction_hash = this.calculate_hash();
        const signature = signing_key.sign(transaction_hash, 'base64');

        this.signature = signature.toDER('hex');
    }

    is_valid() {
        if (this.sender_address === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('Unsigned Transaction!');
        }

        const public_key = ec.keyFromPublic(this.sender_address, 'hex');
        return public_key.verify(this.calculate_hash(), this.signature);
    }
}

class Block {
    constructor(timestamp, transactions, prev_hash = '') {
        this.prev_hash = prev_hash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = 0;
        this.hash = this.calculate_hash();
    }

    calculate_hash() {
        return crypto.createHash('sha256').update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).digest('hex');
    }

    mine_block(difficulty_factor) {
        while (this.hash.substring(0, difficulty_factor) !== Array(difficulty_factor + 1).join('0')) {
            this.nonce++;
            this.hash = this.calculate_hash();
        }
        console.log('Block Mined: ' + this.hash);
    }

    contains_valid_transactions() {
        for (const transaction of this.transactions) {
            if (!transaction.is_valid()) return false;
        }
        return true;
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.create_genesis_block()];
        this.difficulty_factor = 2; // For testing purposes only
        this.pending_transactions = [];
        this.mining_reward = 100; // For testing purposes only
    }

    create_genesis_block() {
        return new Block(Date.parse('2022-01-01'), [], '0');
    }

    get_last_block() {
        return this.chain[this.chain.length - 1];
    }

    mine_pending_transactions(mining_reward_address) {
        const reward_transaction = new Transaction(null, mining_reward_address, this.mining_reward);
        this.pending_transactions.push(reward_transaction);

        const block = new Block(Date.now(), this.pending_transactions, this.get_last_block().hash);
        block.mine_block(this.difficulty_factor);

        console.log('Block Mined!');
        this.chain.push(block);
        this.pending_transactions = [];
    }

    add_transaction(transaction) {
        if (!transaction.sender_address || !transaction.recipient_address) {
            throw new Error('Invalid Transaction! No sender or recipient address.');
        }

        if (!transaction.is_valid()) {
            throw new Error('Invalid Transaction!');
        }

        if (transaction.amount <= 0) {
            throw new Error('Invalid Transaction! Amount less than 0.');
        }
        console.log("Transaction Sender Address: " + transaction.sender_address);
        if (this.get_address_balance(transaction.sender_address) < transaction.amount) {
            throw new Error('Invalid Transaction! Insufficient balance.');
        }

        this.pending_transactions.push(transaction);
        console.log('Transaction Added: ' + transaction);
    }

    get_address_balance(address) {
        let balance = 0;
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.sender_address === address) {
                    balance -= transaction.amount;
                }
                if (transaction.recipient_address === address) {
                    balance += transaction.amount;
                }
            }
        }
        console.log("Balance of Address " + address + ": " + balance);
        return balance;
    }

    get_wallet_transactions(address) {
        const transactions = [];
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                if (transaction.sender_address === address || transaction.recipient_address === address) {
                    transactions.push(transaction);
                }
            }
        }
        return transactions;
    }

    is_valid_chain() {
        const real_genesis = JSON.stringify(this.create_genesis_block());
        if (real_genesis !== JSON.stringify(this.chain[0])) return false;

        for (let counter = 1; counter < this.chain.length; counter++) {
            const curr_block = this.chain[counter];
            const prev_block = this.chain[counter - 1];

            if (prev_block.hash !== curr_block.prev_hash) return false;

            if (curr_block.hash !== curr_block.calculate_hash()) return false;
        }

        return true;
    }
}

module.exports = {
    Blockchain, Transaction,
}
