import pandas as pd

class RubricWdo():


    def __init__(self, source):
       if (source != None and len(source) > 0):
           self.data = self.read_data(source)
       else:
           self.data = self.load_data()

    #read data from source
    def read_data(self, source):
        return pd.read_excel(source, index_col=0, header=0)

    def load_data(self):
        self.grades = ["grade 1", "grade 2", "grade 3"]
        self.categories = ["cat 1", "cat 2", "cat 3"]
        data_matrix = [["1","2","3"],["4","5","6"],["7","8","9"]]
        data = pd.DataFrame(data_matrix, columns=self.grades, index=self.categories)

        return data





