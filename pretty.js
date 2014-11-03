/* Pretty Code v0.1 */
(function(window){
    var pretty = {
        parse: function(data, data_type) {
            var func_name = 'parse_' + data_type;
            try {
                return '<div class="pretty_output pretty_' + data_type + '">' + this[func_name](data) + '</div>';
            }
            catch(e) {
                // If anything can't be processed for whatever reason just return false
                return false;
            }
        },
        parse_json: function(data) {
            var result = '';
            // Find the type of JSON data we've been given
            var value_type = data == null ? 'null' : data.constructor.name.toLowerCase();
            // Based on the type of the data process/format accordingly
            switch(value_type) {
                case 'object':
                    // If we're dealing with an object process it's children recursively
                    var children = '';
                    var key_num=0, key_count = Object.keys(data).length;
                    for(child in data) {
                        children += '<li><span class="key">"' + child + '":</span> ' + this.parse_json(data[child]) + (key_num<key_count-1 ? ',' : '') + '</li>';
                        key_num++;
                    }
                    result = '{' + ((children != '') ? '<ul>' + children + '</ul>' : '') + '}';
                    break;
                case 'array':
                    // If we're dealing with an array process it's elements recursively 
                    var elements = '';
                    for(var i=0; i<data.length; i++) {
                        var element = data[i];
                        elements += '<li>' + this.parse_json(element) + (i<data.length-1 ? ',' : '') + '</li>';
                    }
                    result = '[' + ((elements != '') ? '<ul>' + elements + '</ul>' : '') + ']';
                    break;
                case 'null':
                    // Null's are a special highlighting case
                    result = '<span class="null">null</span>';
                    break;
                case 'string':
                    // String need additional quotes to be valid JSON
                    result = '<span class="string">"' + data + '"</span>';
                    break;
                default:
                    // Everything else can be simply displayed as is
                    result = '<span class="' + value_type + '">' + data + '</span>';
                    break;
            }
            return result;
        },
        parse_css: function(data) {
            var result = '';
            var string_type = 'selector';
            var unused_string = '';

            // First remove any newlines and compress whitespace
            var css_string = data.replace(/(\r\n|\n|\r)/g,'');
            css_string = css_string.replace(/\s{2,}/g, ' ');
            // Split into an array based on the preferred new line points
            css_array = css_string.split(/({|}|;)/);
            
            // Loop through the array
            for(var i=0; i<css_array.length; i++) {
                var element = css_array[i];
                if(['{','}',';'].indexOf(element) >= 0) {
                    // If the element is one of our 3 new line points react accordingly
                    switch(element) {
                        case '{':
                            result += '<div>' + unused_string + ' {' + '<ul>';
                            unused_string = '';
                            string_type = 'declaration';
                            break;
                        case '}':
                            result += '</ul>' + element + '</div>';
                            string_type = 'selector';
                            break;
                        case ';':
                            result += '<li>' + unused_string + ';</li>';
                            unused_string = '';
                            break;
                    }
                }
                else {
                    // Otherwise add spans based on the type of string
                    if(element != '') {
                        if(string_type == 'selector') {
                            // TODO - It could also be a comment
                            unused_string += '<span class="selector">' + element.trim() + '</span>';
                        }
                        else {
                            var declaration_parts = element.split(':');
                            console.log(declaration_parts);
                            var declaration_property = declaration_parts[0].trim();
                            var declaration_value = declaration_parts.splice(0).join('').trim();
                            unused_string += '<span class="property">' + declaration_property + '</span>: <span class="value">' + declaration_value + '</span>';
                        }
                    }
                }
            }

            return result;
        },
    };
    if(typeof define === 'function' && define.amd) {
        define(function(){return pretty});
    }
    else {
        window.pretty = pretty;
    }
})(window);