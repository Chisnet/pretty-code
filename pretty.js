/* Pretty Code v0.12 */
(function(window){
    var escape_html = function(string) {
        var escaped_string = '';
        // Create map of replacements
        var html_replacements = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '`': '&#x60;'
        };
        // Find and replace any occurences
        escaped_string = string.replace(/&|<|>|"|'|`/g, function(match) {
            return html_replacements[match];
        });

        return escaped_string;
    };
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
                    result = '<span class="string">"' + escape_html(data) + '"</span>';
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
            var in_selector = false;
            var in_comment = false;
            var multiline_comment = false;
            var unused_string = '';
            
            var data_array = css_string.split(/({|}|;|\r\n|\n|\r|\/\*|\*\/)/);
            data_array = data_array.filter(function(e){return ['',' '].indexOf(e) < 0});

            for(var i=0; i<data_array.length; i++) {
                var element = data_array[i];
                if(!/(\r\n|\n|\r)/.test(element)) {
                    element = element.trim();
                }
                // Comments
                if(/^\/\*/.test(element)) {
                    // Start of comment
                    unused_string += element + ' ';
                    in_comment = true;
                }
                else if(/^\*\//.test(element)) {
                    // End of comment
                    if(multiline_comment) {
                        result += '<p class="comment">' + unused_string + ' ' + element + '</p>';
                    }
                    else {
                        result += '<span class="comment">' + unused_string + ' ' + element + '</span>';
                    }
                    unused_string = '';
                    in_comment = false;
                    multiline_comment = false;
                }
                // New lines
                else if(/(\r\n|\n|\r)/.test(element)) {
                    // We only care about new-lines in comments to keep any multi-line comment formatting
                    if(in_comment) {
                        unused_string += '<br/>';
                        multiline_comment = true;
                    }
                }
                // Everything else?
                else {
                    if(in_comment) {
                        unused_string += element;
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