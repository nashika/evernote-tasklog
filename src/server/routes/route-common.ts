
export default {

    mergeParams(req:{body:any, query:any}):Object {
        var body = req['body'] || {};
        var query = req['query'] || {};
        return merge(true, body, query);
    }

}
