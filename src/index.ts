/*
** EPITECH PROJECT, 2024
** epytodo-checker
** File description:
** index
*/

import dotenv from 'dotenv'
import Test, { TestStatus } from './classes/Test.js';
import Storage from './classes/Storage.js';

dotenv.config();

export const baseURL = `http://localhost:${process.env.PORT}`;

export const storage = new Storage();

const tests: Array<Test> = [];
const results: Record<string, TestStatus> = {};

async function runTests(tests: Array<Test>) {
    if (tests.length === 0)
        return console.log('No tests to run');
    for (const test of tests) {
        for (const dependency of test.getDependencies()) {
            if (results[dependency] !== TestStatus.PASSED) {
                results[test.getId()] = TestStatus.SKIPPED;
                test.skip(dependency);
                break;
            }
        }
        if (test.getStatus() === TestStatus.SKIPPED)
            continue;

        await test.execute();
        test.runCallback();
        if (test.isSilent())
            continue;
        results[test.getId()] = test.getStatus();
    }
}

// -------- TESTS BELOW THIS LINE --------

// RANDOM VALUES

function genEmail() {
    return `test-${Math.floor(Math.random() * 100000)}@mail.org`;
}

storage.set("EMAIL_1", genEmail());
storage.set("EMAIL_2", genEmail());
storage.set("EMAIL_3", genEmail());
storage.set("EMAIL_4", genEmail());
storage.set("EMAIL_5", genEmail());
storage.set("EMAIL_6", genEmail());

// TESTS

tests.push(
    new Test('register-exists', 'POST', '/register')
        .setExpectedStatusNot(404)
);

tests.push(
    new Test('login-exists', 'POST', '/login')
        .setExpectedStatusNot(404)
);

tests.push(
    new Test('user-exists', 'POST', '/user')
        .setExpectedStatusNot(404)
);

tests.push(
    new Test('user-todos-exists', 'GET', '/user/todos')
        .setExpectedStatusNot(404)
);

tests.push(
    new Test('user-spec-exists', 'GET', '/users/69420')
        .setExpectedStatusNot(404)
);

tests.push(
    new Test('todos-exists', 'POST', '/todos')
        .setExpectedStatusNot(404)
);

tests.push(
    new Test('todo-exists', 'GET', '/todos/69420')
        .setExpectedStatusNot(404)
);

tests.push(
    new Test('register-basics', 'POST', '/register')
        .addDependency('register-exists')
        .setExpectedStatus(200)
        .setParams({
            email: "{EMAIL_1}",
            name: "testname",
            firstname: "testfirstname",
            password: "testpassword"
        })
        .setExpected({
            token: ">>TOKEN"
        })
)

tests.push(
    new Test('register-invalid-email', 'POST', '/register')
        .addDependency('register-exists')
        .setExpectedStatus(400)
        .setParams({
            email: "invalid-email",
            name: "testname",
            firstname: "testfirstname",
            password: "testpassword"
        })
)

tests.push(
    new Test('register-already-exists', 'POST', '/register')
        .addDependency('register-exists')
        .setExpectedStatus(403)
        .setParams({
            email: "{EMAIL_1}",
            name: "testname",
            firstname: "testfirstname",
            password: "testpassword"
        })
        .setExpected({
            msg: "Account already exists"
        })
)

tests.push(
    new Test('login-basics', 'POST', '/login')
        .addDependency('login-exists')
        .addDependency('register-basics')
        .setExpectedStatus(200)
        .setParams({
            email: "{EMAIL_1}",
            password: "testpassword"
        })
        .setExpected({
            token: ">>TOKEN"
        })
)

tests.push(
    new Test('login-invalid-email', 'POST', '/login')
        .addDependency('login-exists')
        .addDependency('register-basics')
        .setExpectedStatus(400)
        .setParams({
            email: "invalid-email",
            password: "testpassword"
        })
)

tests.push(
    new Test('login-no-password', 'POST', '/login')
        .addDependency('login-exists')
        .addDependency('register-basics')
        .setExpectedStatus(400)
        .setParams({
            email: "{EMAIL_1}"
        })
)

tests.push(
    new Test('login-invalid-password', 'POST', '/login')
        .addDependency('login-exists')
        .addDependency('register-basics')
        .setExpectedStatus(403)
        .setParams({
            email: "{EMAIL_1}",
            password: "invalid-password"
        })
)

tests.push(
    new Test('user-basics', 'GET', '/user', true)
        .addDependency('user-exists')
        .addDependency('login-basics')
        .setExpectedStatus(200)
        .setExpected({
            id: "[number]>>USER_ID_1",
            email: "{EMAIL_1}",
            name: "testname",
            firstname: "testfirstname"
        })
        // .setCallback(() => {
        //     console.log('USER ID 1:', storage.get('USER_ID_1'));
        // })
)

tests.push(
    new Test('user-not-logged', 'GET', '/user')
        .addDependency('user-exists')
        .setExpectedStatus(401)
)

tests.push(
    new Test('user-todos-basics', 'GET', '/user/todos', true)
        .addDependency('user-todos-exists')
        .addDependency('login-basics')
        .setExpectedStatus(200)
)

tests.push(
    new Test('user-todos-not-logged', 'GET', '/user/todos')
        .addDependency('user-todos-exists')
        .addDependency('login-basics')
        .setExpectedStatus(401)
)

tests.push(
    new Test('user-spec-basics', 'GET', '/users/:id', true)
        .addDependency('user-spec-exists')
        .addDependency('login-basics')
        .fillRouteParams({
            id: "{USER_ID_1}"
        })
        .setExpectedStatus(200)
        .setExpected({
            id: "[number]",
            email: "{EMAIL_1}",
            name: "testname",
            firstname: "testfirstname"
        })
)

// SILENT FOR LOGIN
tests.push(
    new Test('register-silent', 'POST', '/register')
        .addDependency('register-exists')
        .setParams({
            email: "{EMAIL_2}",
            name: "testname2",
            firstname: "testfirstname2",
            password: "testpassword"
        })
        .setExpected({
            token: ">>TOKEN"
        })
        .setSilent()
)

tests.push(
    new Test('user-silent', 'GET', '/user', true)
        .addDependency('user-basics')
        .setExpected({
            id: ">>USER_ID_2",
        })
        .setSilent()
)

tests.push(
    new Test('login-silent', 'POST', '/login')
        .addDependency('login-exists')
        .setParams({
            email: "{EMAIL_1}",
            password: "testpassword"
        })
        .setExpected({
            token: ">>TOKEN"
        })
        .setSilent()
)

tests.push(
    new Test('user-basics-2', 'GET', '/users/:id', true)
        .addDependency('user-spec-exists')
        .fillRouteParams({
            id: "{USER_ID_2}"
        })
        .setExpected({
            id: "[number]>>USER_ID_2",
            email: "{EMAIL_2}",
            name: "testname2",
            firstname: "testfirstname2"
        })
)

tests.push(
    new Test('users-notfound', 'GET', '/users/69420', true)
        .addDependency('user-spec-exists')
        .setExpectedStatus(404)
)

tests.push(
    new Test('users-delete', 'DELETE', '/users/:id', true)
        .addDependency('user-spec-basics')
        .fillRouteParams({
            id: "{USER_ID_2}"
        })
        .setExpectedStatus(200)
)

tests.push(
    new Test('user-notfound-after-delete', 'GET', '/users/:id', true)
        .addDependency('users-delete')
        .fillRouteParams({
            id: "{USER_ID_2}"
        })
        .setExpectedStatus(404)
)

tests.push(
    new Test('user-delete-not-logged', 'DELETE', '/users/:id')
        .addDependency('user-spec-basics')
        .fillRouteParams({
            id: "{USER_ID_1}"
        })
        .setExpectedStatus(401)
)

tests.push(
    new Test('user-delete-unknown', 'DELETE', '/users/:id', true)
        .addDependency('user-spec-basics')
        .fillRouteParams({
            id: "69420"
        })
        .setExpectedStatus(404)
)

tests.push(
    new Test('todo-basics-get', 'GET', '/todos', true)
        .addDependency('todos-exists')
        .setExpectedStatus(200)
)

tests.push(
    new Test('todo-basics-post', 'POST', '/todos', true)
        .addDependency('todos-exists')
        .setExpectedStatus(200)
        .setParams({
            title: "testtitle",
            description: "testcontent",
            due_time: "2024-01-01 00:00:00",
            user_id: "{USER_ID_1}",
            status: "todo"
        })
)

tests.push(
    new Test('todo-post-invalid', 'POST', '/todos', true)
        .addDependency('todo-basics-post')
        .setExpectedStatus(400)
        .setParams({
            title: "testtitle",
            description: "testcontent",
            due_time: "2024-01-01 00:00:00",
            user_id: "{USER_ID_1}",
            status: "invalid-status"
        })
)

tests.push(
    new Test('todo-post-invalid-date', 'POST', '/todos', true)
        .addDependency('todo-basics-post')
        .setExpectedStatus(400)
        .setParams({
            title: "testtitle",
            description: "testcontent",
            due_time: "invalid-date",
            user_id: "{USER_ID_1}",
            status: "todo"
        })
)

tests.push(
    new Test('todo-get-unknown', 'GET', '/todos/69420', true)
        .addDependency('todo-exists')
        .setExpectedStatus(404)
)

tests.push(
    new Test('todo-post-silent', 'POST', '/todos', true)
        .addDependency('todos-exists')
        .setExpectedStatus(200)
        .setParams({
            title: "testtitle2",
            description: "testcontent2",
            due_time: "2024-01-01 00:00:00",
            user_id: "{USER_ID_1}",
            status: "todo",
        })
        .setExpected({
            id: ">>TODO_ID_1"
        })
        .setSilent()
)

tests.push(
    new Test('todo-get-basics', 'GET', '/todos/:id', true)
        .addDependency('todo-exists')
        .fillRouteParams({
            id: "{TODO_ID_1}"
        })
        .setExpectedStatus(200)
)

tests.push(
    new Test('todo-delete-basics', 'DELETE', '/todos/:id', true)
        .addDependency('todo-get-basics')
        .fillRouteParams({
            id: "{TODO_ID_1}"
        })
        .setExpectedStatus(200)
)

tests.push(
    new Test('todo-get-unknown-after-delete', 'GET', '/todos/:id', true)
        .addDependency('todo-delete-basics')
        .fillRouteParams({
            id: "{TODO_ID_1}"
        })
        .setExpectedStatus(404)
)

tests.push(
    new Test('todo-delete-not-logged', 'DELETE', '/todos/:id')
        .addDependency('todo-get-basics')
        .fillRouteParams({
            id: "{TODO_ID_1}"
        })
        .setExpectedStatus(401)
)

tests.push(
    new Test('todo-delete-unknown', 'DELETE', '/todos/:id', true)
        .addDependency('todo-get-basics')
        .fillRouteParams({
            id: "69420"
        })
        .setExpectedStatus(404)
)

// -------- TESTS ABOVE THIS LINE --------

runTests(tests)
    .then(() => {
        console.log(`\x1b[34mTests\x1b[0m: ${Object.entries(results).length} | \x1b[32mPassed\x1b[0m: ${Object.values(results).filter((status) => status === TestStatus.PASSED).length} | \x1b[31mFailed\x1b[0m: ${Object.values(results).filter((status) => status === TestStatus.FAILED).length} | \x1b[90mSkipped\x1b[0m: ${Object.values(results).filter((status) => status === TestStatus.SKIPPED).length} | \x1b[31mError\x1b[0m: ${Object.values(results).filter((status) => status === TestStatus.ERROR).length}`);
        if (process.argv.includes("--verbose-errors")) {
            for (const [testId, status] of Object.entries(results)) {
                if (status === TestStatus.ERROR)
                    console.log(`\x1b[34m${testId}\x1b[0m: ${status}`);
            }
        }
    });
