export interface IRegister {
    (server:any, options:any, next:any): void;
    attributes?: any;
}

/**
 * structure of user in database
 */
export interface IUser {
    _id: string;
    _rev?: string;
    name: string;
    surname: string;
    mail: string;
    password: string;
    major: string;
    picture: string;
    semester: number;
    subscribed_groups: string[];
    type: string;
}

export default
class User {
    db:any;
    joi:any;
    userSchema:any;

    constructor() {
        this.register.attributes = {
            name: 'bemily-user',
            version: '0.1.0'
        };
        this.joi = require('joi');
        this.initSchema();
    }

    private initSchema():void {
        this.userSchema = this.joi.object().keys({
            _id: this.joi.string().required(),
            _rev: this.joi.string(),
            name: this.joi.string(),
            surname: this.joi.string(),
            picture: this.joi.optional(),
            mail: this.joi.string(),
            password: this.joi.string(),
            major: this.joi.string(),
            subscribed_groups: this.joi.array(),
            semester: this.joi.number().integer(),
            type: this.joi.string().required()
        });
    }

    register:IRegister = (server, options, next) => {
        server.bind(this);

        if (!options.databaseInstance) {
            throw new Error('options.databaseInstance needs to be defined');
        }
        this.db = options.databaseInstance;

/*      // FIXME: check alternative import of db instance with server.dependency
        server.dependency('bemily-database', (server, next) => {
            this.db = server.plugins['bemily-database'];
            next();
        });
*/
        this._register(server, options);
        next();
    };

    private _register(server, options) {
        // get user information about logged in user
        server.route({
            method: 'GET',
            path: '/me',
            handler: (request, reply) => {
                var userId = request.session.get('loggedInUser');
                this.db.getUserById(userId, (err, data) => {
                    if (err) {
                        return reply(err).code(400);
                    }
                    reply(data);
                })
            }
        });

        // route to get user
        server.route({
            method: 'GET',
            path: '/users/{userid}',
            handler: (request, reply) => {
                this.db.getUserById(request.params.userid, (err, data) => {
                    if (err) {
                        return reply(err).code(400);
                    }
                    reply(data);
                });
            }
        });

        // route to update user information
        server.route({
            method: 'PUT',
            path: '/users',
            handler: (request, reply) => {
                this.joi.validate(request.payload, this.userSchema, (err, user:IUser)=> {
                    if (err) {
                        return reply(err).code(400);
                    } else {
                        this.db.updateUser(user._id, user._rev, (err, data) => {
                            if (err) {
                                return reply(err).code(400);
                            }
                            reply(data);
                        });

                    }
                });
            }
        });

        // route to create new user
        server.route({
            method: 'POST',
            path: '/users',
            handler: (request, reply) => {
                var user:IUser = request.payload;
                this.db.createUser(user, (err, data) => {
                    if (err) {
                        return reply(err).code(400);
                    }
                    reply(data);
                });
            }
        });

        return 'register';
    }

    errorInit(err) {
        if (err) {
            console.log('Error: init plugin failed:', err);
        }
    }

}