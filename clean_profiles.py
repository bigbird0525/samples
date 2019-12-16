import os,json

class CleanProfiles:
    def __init__(self):
        self.file_list = []

    def get_file_list(self):
        return self.file_list
    
    def set_file_list(self, dir_root):
        for path, subdirs, files in os.walk(dir_root):
            for name in files:
                f = os.path.join(path, name)
                if f.endswith('.json'):
                    self.file_list.append(f)
        return self.file_list
    
    def cleanProfiles(self):
        if len(self.file_list) == 0:
            raise "File List is empty!"
        else:
            for f in self.file_list:
                with open(f) as old_file:
                    try:
                        data = json.load(old_file)
                        for d in data["common"]["global"]:
                            if d["label"] == "Stop After n Microbatch":
                                d["defaultValue"] = "0"
                                d["value"] = "0"
                                
                            if d["label"] == "Start Date" or d["label"] == "End Date":
                                d["defaultValue"] = ""
                                d["value"] = ""
                            
                            if d["id"] == "dataSource":
                                d["defaultValue"] = {
                                    "dataSource": "/vitria/m3o/datasource/DefaultDomain/charter_ref_db"
                                }
                                d["value"] = {
                                    "dataSource": "/vitria/m3o/datasource/DefaultDomain/charter_ref_db"
                                }
                        with open(f, 'w') as outfile:
                            json.dump(data, outfile, indent=4)
                    except ValueError as err:
                        print "Error for {}\n{}".format(f,err)


if __name__ == '__main__':
    clp = CleanProfiles()
    clp.set_file_list('.')
    clp.cleanProfiles()
