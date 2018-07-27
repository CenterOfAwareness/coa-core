<a name="COA"></a>

## COA
**Kind**: global class  

* [COA](#COA)
    * [new COA(host, port, username, password)](#new_COA_new)
    * [.client](#COA+client)
    * [.subscribe(db, path, callback)](#COA+subscribe) ⇒ <code>number</code>
    * [.unsubscribe([db], [path], [id])](#COA+unsubscribe) ⇒ <code>undefined</code>

<a name="new_COA_new"></a>

### new COA(host, port, username, password)
An interface to the COA JSON-DB server


| Param | Type | Description |
| --- | --- | --- |
| host | <code>string</code> | The COA JSON-DB server address |
| port | <code>number</code> | The COA JSON-DB server port |
| username | <code>string</code> | Your system's COA username |
| password | <code>string</code> | Your system's COA password |

<a name="COA+client"></a>

### coA.client
**Kind**: instance property of [<code>COA</code>](#COA)  
**Properties**

| Type |
| --- |
| <code>JSONClient</code> | 

<a name="COA+subscribe"></a>

### coA.subscribe(db, path, callback) ⇒ <code>number</code>
Subscribe to updates

**Kind**: instance method of [<code>COA</code>](#COA)  
**Returns**: <code>number</code> - The callback ID, for use with coa.unsubscribe  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>string</code> | The JSON-DB module to subscribe to (eg. 'presence') |
| path | <code>string</code> | The path to subscribe to (eg. 'presence.ecbbs.0') |
| callback | <code>function</code> | A function that accepts a JSON-DB update object as its sole parameter |

<a name="COA+unsubscribe"></a>

### coA.unsubscribe([db], [path], [id]) ⇒ <code>undefined</code>
Unsubscribe from updates

**Kind**: instance method of [<code>COA</code>](#COA)  

| Param | Type | Description |
| --- | --- | --- |
| [db] | <code>string</code> | The JSON-DB module to unsubscribe from (eg. 'presence') (undefined means all) |
| [path] | <code>string</code> | The path to unsubscribe from (eg. 'presence.ecbbs.0') (undefined means all) |
| [id] | <code>number</code> | The callback to remove (undefined means all) |

<a name="Presence"></a>

## Presence
**Kind**: global class  

* [Presence](#Presence)
    * [new Presence(coa)](#new_Presence_new)
    * [.read([system], [node])](#Presence+read) ⇒ <code>object</code> \| <code>null</code>
    * [.write([node])](#Presence+write) ⇒ <code>undefined</code>

<a name="new_Presence_new"></a>

### new Presence(coa)
An interface to the COA Presence database


| Param | Type | Description |
| --- | --- | --- |
| coa | <code>COA</code> | An instance of the COA object (client/lib/coa.js) |

<a name="Presence+read"></a>

### presence.read([system], [node]) ⇒ <code>object</code> \| <code>null</code>
Read presence data for all systems, one system, or one node on one system

**Kind**: instance method of [<code>Presence</code>](#Presence)  
**Returns**: <code>object</code> \| <code>null</code> - The requested presence data, or null if unavailable  

| Param | Type | Description |
| --- | --- | --- |
| [system] | <code>string</code> | A particular system (optional) |
| [node] | <code>number</code> | A node of [system] (optional) |

<a name="Presence+write"></a>

### presence.write([node]) ⇒ <code>undefined</code>
Write presence data for a given node, or the entire system

**Kind**: instance method of [<code>Presence</code>](#Presence)  

| Param | Type | Description |
| --- | --- | --- |
| [node] | <code>number</code> | The node to send an update about (optional) |

